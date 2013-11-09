package de.tudresden.mg.ebookshelf.data;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Timer;

import org.basex.BaseXServer;
import org.basex.core.cmd.CreateDB;
import org.basex.server.ClientSession;

import com.sun.org.apache.bcel.internal.generic.NEWARRAY;



public class BaseXController 
{
	private BaseXServer server = null;
	
	private ClientSession _session;
	private Map<String, byte[]> cache;
	
	// for details on java singletons, see
	// http://en.wikipedia.org/wiki/Singleton_pattern#The_solution_of_Bill_Pugh
	private BaseXController()
	{
		// private constructor prevents instantiation by other classes
		 this.cache = new HashMap<String, byte[]>();
	}
	
	public static BaseXController getInstance()
	{
		return BaseXControllerHolder.INSTANCE;
	}
	
	private static class BaseXControllerHolder
	{
		public static final BaseXController INSTANCE = new BaseXController();
	}
	
	// end of singleton minutiae
	
	public boolean createServer(String pathToXMLData)
	{
		if(this.isRunning())
			return false;
		
		try {
			// start server on default port 1984
			server = new BaseXServer(); 
			
			// create session and initialize DB
		    ClientSession session = getSession();
		    
		    
		    session.execute(new CreateDB("input", pathToXMLData));
		    session.execute("OPEN input");
		    
		    session.close();
		    return true;
		    
		} catch (IOException e) {
			System.out.println("Error while creating BaseX Server instance.");
			e.printStackTrace();
		} 
		
		return false;
	}
	
	/**
	 * Executes a query and prints the result to System.out.
	 * @param XQuery
	 * @throws IOException 
	 */
	public void executeQuery(String XQuery) throws IOException
	{
		this.executeQuery(XQuery, System.out);
	}
	
	/**
	 * Executes a query and prints the result to the given output stream.
	 * @param XQuery
	 * @throws IOException 
	 */
	public void executeQuery(String XQuery, OutputStream out) throws IOException
	{
		if(this._session == null)
		{
			this._session = getSession();	
		}
		
		
		_session.execute("OPEN input");
		_session.setOutputStream(out);
		_session.execute(XQuery);
		
		
		
//		ClientSession session = getSession();
//		session.execute("OPEN input");
//		session.setOutputStream(out);
//				
//		session.execute(XQuery);
//		
//		session.close();
	}
	
	public void executeQueryWithCache(String XQuery, OutputStream out) throws IOException
	{
		// check if query is cached
		if(this.cache.containsKey(XQuery))
		{
			// if yes, write the content of the cache to the given output stream
			out.write(this.cache.get(XQuery));
		}
		else
		{
			// if not, create temporary output stream
			ByteArrayOutputStream cacheStream = new ByteArrayOutputStream();
			// write query result to cacheStream
			this.executeQuery(XQuery, cacheStream);
			// and store the cacheStream's value as byte array
			this.cache.put(XQuery, cacheStream.toByteArray());
			// do not forget to also write the query result to the original out stream:
			out.write(cacheStream.toByteArray());
		}
		
		
	}
	
	/**
	 * Indicates whether the BaseX server instance is assigned.
	 * @return
	 */
	public boolean isRunning()
	{
		return this.server != null;
	}
	
	/**
	 * Creates a new client session for the default server instance.
	 * @return a new ClientSession object
	 */
	public ClientSession getSession()
	{
		try {
			return new ClientSession("localhost", 1984, "admin", "admin");
		} catch (IOException e) {
			System.out.println("Error while creating a BaseX session.");
			e.printStackTrace();
		}
		
		return null;
	}
	
}
